import sys
import os
import argparse
import time
import json
import re
import csv

from webdav3.client import Client

import torch
import torchvision
from torch.utils.data import Dataset
from torch.utils.data import DataLoader
import pytorch_lightning as pl

from skimage import io

from DiffusionFastForward.src import PixelDiffusion
from DiffusionFastForward.src import EMA
from DiffusionFastForward.src import ProgressUpdater

from kornia.utils import image_to_tensor
import kornia.augmentation as KA


CROP_SIZE = 64

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

def get_train_path(dataset_dir):
    return os.path.join(dataset_dir, 'train')

def get_validation_path(dataset_dir):
    return os.path.join(dataset_dir, 'val')

def get_logs_path(training_dir):
    return os.path.join(training_dir)

def get_metadata(metadata_file):
    with open(metadata_file, 'r') as f:
        metadata = json.load(f)
    return metadata

def set_metadata(metadata_file, key, value):
    metadata = get_metadata(metadata_file)
    metadata[key] = value
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)

def train(args):

    print(f'Args: {args}')

    # Read training metadata (including hyperparameters)
    metadata = get_metadata(args.metadata_file)
    print(f'Metdata: {metadata}')

    # Set up WebDAV connection
    dav = Client({
        'webdav_hostname': args.dav_url,
        'webdav_login':    args.dav_username,
        'webdav_password': args.dav_password,
    })

    set_metadata(args.metadata_file, "trainingProgress", 0)
    set_metadata(args.metadata_file, "uploadDone", False)
    dav.upload_sync(local_path=args.training_dir, remote_path=args.training_dir)

    # Set up hyperparameters
    max_steps = int(metadata["hyperparameter:maxSteps"])
    learning_rate=1e-4
    batch_size=16
    num_timesteps=1000
    paired_dataset=False

    inp_T=[KA.RandomCrop((CROP_SIZE,CROP_SIZE))]

    train_ds=SimpleImageDataset(get_train_path(args.dataset_dir), transforms=inp_T, paired=paired_dataset)

    val_ds=SimpleImageDataset(get_validation_path(args.dataset_dir), transforms=inp_T, paired=paired_dataset)

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
        default_root_dir=get_logs_path(args.training_dir),
        max_steps=model.max_steps,
        callbacks=[EMA(0.9999), ProgressUpdater(args)],
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
    trainer.save_checkpoint(os.path.join(args.training_dir, 'model.ckpt'))
    print('Traning done. Model saved.')

    print('Uploading to WebDAV server')
    for filename in os.listdir(args.training_dir):
        file_path = os.path.join(args.training_dir, filename)
        dav.upload_sync(local_path=file_path, remote_path=file_path)
    
    # Mark training as done
    set_metadata(args.metadata_file, "uploadDone", True)
    dav.upload_sync(local_path=args.metadata_file, remote_path=args.metadata_file)
    print('Done.')


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train a model")
    parser.add_argument("--dav-url", required=True, help="URL of WebDAV server")
    parser.add_argument("--dav-username", required=True, help="Username for WebDAV server")
    parser.add_argument("--dav-password", required=True, help="Password for WebDAV server")
    parser.add_argument("--dataset-dir", required=True, help="Path to dataset directory")
    parser.add_argument("--training-dir", required=True, help="Path to working directory")
    parser.add_argument("--metadata-file", required=True, help="Relative path to hyperparameters file")
    
    args = parser.parse_args()
    train(args)
