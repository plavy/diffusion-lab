import torch
import torchvision
from torch.utils.data import Dataset
from torch.utils.data import DataLoader
import pytorch_lightning as pl

from skimage import io
# import PIL.Image, PIL.ImageTk

import os
import sys
import re
import csv

from DiffusionFastForward.src import PixelDiffusion
from DiffusionFastForward.src import EMA

from kornia.utils import image_to_tensor
import kornia.augmentation as KA

CROP_SIZE = 64
DATASET_DIR = './datasets'
MODEL_DIR = './trained_models'
LOG_DIR = './logs'


class SimpleImageDataset(Dataset):
    """Dataset returning images in a folder."""

    def __init__(self,
                 root_dir,
                 transforms=None,
                 paired=True,
                 return_pair=False):
        self.root_dir = root_dir
        self.transforms = transforms
        self.paired=paired
        self.return_pair=return_pair
        
        # set up transforms
        if self.transforms is not None:
            if self.paired:
                data_keys=2*['input']
            else:
                data_keys=['input']

            self.input_T=KA.container.AugmentationSequential(
                *self.transforms,
                data_keys=data_keys,
                same_on_batch=False
            )   
        
        # check files
        supported_formats=['webp','jpg']
        self.files=[el for el in os.listdir(self.root_dir) if el.split('.')[-1] in supported_formats]

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        if torch.is_tensor(idx):
            idx = idx.tolist()            

        img_name = os.path.join(self.root_dir,
                                self.files[idx])
        image = image_to_tensor(io.imread(img_name))/255

        if self.paired:
            c,h,w=image.shape
            slice=int(w/2)
            image2=image[:,:,slice:]
            image=image[:,:,:slice]
            if self.transforms is not None:
                out = self.input_T(image,image2)
                image=out[0][0]
                image2=out[1][0]
        elif self.transforms is not None:
            image = self.input_T(image)[0]

        if self.return_pair:
            return image2,image
        else:
            return image

def get_train_path(model_name):
    return os.path.join(DATASET_DIR, model_name, 'train')

def get_validation_path(model_name):
    return os.path.join(DATASET_DIR, model_name, 'val')

def train(model_name, max_steps=2e5, learning_rate=1e-4, batch_size=16, num_timesteps=1000, paired_dataset=True):

    inp_T=[KA.RandomCrop((CROP_SIZE,CROP_SIZE))]

    train_ds=SimpleImageDataset(get_train_path(model_name), transforms=inp_T, paired=paired_dataset)

    val_ds=SimpleImageDataset(get_validation_path(model_name), transforms=inp_T, paired=paired_dataset)

    model=PixelDiffusion(
                         max_steps=max_steps,
                         lr=learning_rate,
                         batch_size=batch_size,
                         num_timesteps=num_timesteps)

    train_dl = DataLoader(train_ds,
                          batch_size=batch_size,
                          shuffle=True,
                          num_workers=4)
    
    val_dl = DataLoader(val_ds,
                              batch_size=batch_size,
                              shuffle=False,
                              num_workers=4)

    trainer = pl.Trainer(
        default_root_dir=f'{LOG_DIR}/{model_name}/',
        max_steps=model.max_steps,
        callbacks=[EMA(0.9999)],
        accelerator='gpu',
        devices=[0]
    )

    print(f'''Starting training with hyperparameters:
    max_steps={max_steps}
    learning_rate={learning_rate}
    batch_size={batch_size}
    num_timesteps={num_timesteps}
    paired_dataset={paired_dataset}''')

    trainer.fit(model=model, train_dataloaders=train_dl, val_dataloaders=val_dl)
    trainer.save_checkpoint(os.path.join(MODEL_DIR, f'{model_name}.ckpt'))
    print('Max steps reached. Model saved.')

def sample(model_name, canvases, CANVAS_SIZE, progress_callback):
    if not os.path.exists(os.path.join(MODEL_DIR, f'{model_name}.ckpt')):
        print('Model not yet trained.')
        return

    model = PixelDiffusion.load_from_checkpoint(checkpoint_path=os.path.join(MODEL_DIR, f'{model_name}.ckpt'))

    model.cuda()
    out=model(batch_size=len(canvases), shape=(CROP_SIZE, CROP_SIZE), verbose=True, progress_callback=progress_callback)

    # Add images to the canvas
    transform = torchvision.transforms.ToPILImage()
    for i in range(len(canvases)):
        pil_img = transform(out[i].detach().cpu()).resize((CANVAS_SIZE * 2, CANVAS_SIZE * 2))
        img = PIL.ImageTk.PhotoImage(image = pil_img)
        canvases[i].create_image(0, 0, image=img)
        canvases[i].image = img # keep a reference

def is_model_trained(model_name):
    return os.path.exists(os.path.join(MODEL_DIR, f'{model_name}.ckpt'))

def set_metadata(model_name, label):
    if not is_model_trained(model_name):
        text = f"""
Model name: {model_name}
Training images: {len(os.listdir(get_train_path(model_name)))}
Validation images: {len(os.listdir(get_validation_path(model_name)))}
Model not yet trained.
"""
        label.config(text=text)
        return
    
    model = PixelDiffusion.load_from_checkpoint(checkpoint_path=os.path.join(MODEL_DIR, f'{model_name}.ckpt'))

    # Add metadata to the label
    text = f"""
Model name: {model_name}
Training images: {len(os.listdir(get_train_path(model_name)))}
Validation images: {len(os.listdir(get_validation_path(model_name)))}
Training steps: {int(model.hparams.max_steps)}
Learing rate: {model.hparams.lr}
Diffusion timesteps: {model.hparams.num_timesteps}
"""
    label.config(text=text)

def string_numerical_sort(test_string):
    # find a number in the string, and sort by the number's value
    return list(map(int, re.findall(r'\d+', test_string)))[0]

def plot_losses(model_name, canvas, axis):
    axis.clear()
    axis.set_ylabel('Loss')
    axis.set_xlabel('Epoch')

    model_log_dir = os.path.join(LOG_DIR, model_name, 'lightning_logs')
    if not os.path.exists(model_log_dir):
        canvas.draw()
        return
    
    versions = os.listdir(model_log_dir)
    versions.sort(key=string_numerical_sort)
    csv_path = os.path.join(model_log_dir, versions[-1], 'metrics.csv')
    if not is_model_trained(model_name) or not os.path.exists(csv_path):
        canvas.draw()
        return

    train_epoch = []
    train_loss = []
    val_epoch = []
    val_loss = []
    with open(csv_path, 'r') as file:
        csv_reader = csv.DictReader(file)
        row_list = list(csv_reader)
    num_epoch = int(row_list[-1].get('epoch'))
    idx = num_epoch // 200 # max number of epochs on graph
    for row in row_list:
        epoch = int(row.get('epoch'))
        if (idx == 0 or epoch % idx == 0 or epoch == num_epoch - 1) and row.get('train_loss') and epoch not in train_epoch:
            train_epoch.append(epoch)
            train_loss.append(float(row.get('train_loss')))
        if (idx == 0 or epoch % idx == 0 or epoch == num_epoch - 1) and row.get('val_loss') and epoch not in val_epoch:
            val_epoch.append(epoch)
            val_loss.append(float(row.get('val_loss')))
    fig = axis.get_figure()
    train_axis, = axis.plot(train_epoch, train_loss)
    val_axis, = axis.plot(val_epoch, val_loss)
    fig.legend((train_axis, val_axis), ('Train loss', 'Validation loss'), 'upper right')
    canvas.draw()

def set_dataset_preview(model_name, canvases, CANVAS_SIZE, paired_dataset=True):
    inp_T=[KA.RandomCrop((CROP_SIZE,CROP_SIZE))]
    train_ds=SimpleImageDataset(get_train_path(model_name), transforms=inp_T, paired=paired_dataset)

    # Add images to the canvas
    transform = torchvision.transforms.ToPILImage()
    for i in range(len(canvases)):
        pil_img = transform(train_ds[i]).resize((CANVAS_SIZE * 2, CANVAS_SIZE * 2))
        img = PIL.ImageTk.PhotoImage(image = pil_img)
        canvases[i].create_image(0, 0, image=img)
        canvases[i].image = img # keep a reference


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Model name required.")
        exit(1)
    auth = sys.argv[1]
    print(auth)
    model = sys.argv[2]
    if len(sys.argv) == 2:
        train(model)
#    if len(sys.argv) == 3:
#        max_steps = float(sys.argv[2])
#        train(model, max_steps)
#    if len(sys.argv) == 7:
#        max_steps = float(sys.argv[2])
#        learning_rate = float(sys.argv[3])
#        batch_size = int(sys.argv[4])
#        num_timesteps = int(sys.argv[5])
#        paired_dataset = bool(int(sys.argv[6]))
#        train(model, max_steps, learning_rate, batch_size, num_timesteps, paired_dataset)