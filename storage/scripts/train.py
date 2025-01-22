import os
import argparse
import json

from webdav3.client import Client
from PIL import Image
import torch
from torchvision import transforms
from torch.utils.data import Dataset, DataLoader, random_split
import pytorch_lightning as pl

from DiffusionFastForward.src import PixelDiffusion
from DiffusionFastForward.src import EMA
from DiffusionFastForward.src import ProgressUpdater

CROP_SIZE = 64

class ImageDataset(Dataset):
    def __init__(self,
                 root_dir,
                 transform,
                ):
        self.root_dir = root_dir
        self.transform = transform
        self.files=[os.path.join(root_dir, file) for file in os.listdir(self.root_dir) if file.endswith('.jpg')]

    def __len__(self):
        return len(self.files)

    def __getitem__(self, idx):
        path = self.files[idx]
        image = self.transform(Image.open(path).convert("RGB"))
        return image

class ImageDataModule(pl.LightningDataModule):
    def __init__(self, data_dir, batch_size, transform, val_proportion):
        super().__init__()
        self.data_dir = data_dir
        self.batch_size = batch_size
        self.transform = transform
        self.val_proportion = val_proportion

    def setup(self, stage=None):
        dataset = ImageDataset(self.data_dir, transform=self.transform)
        
        # Compute the sizes for train and validation splits
        val_size = int(len(dataset) * self.val_proportion)
        train_size = len(dataset) - val_size

        self.train_dataset, self.val_dataset = random_split(dataset, [train_size, val_size])

    def train_dataloader(self):
        return DataLoader(self.train_dataset, batch_size=self.batch_size, shuffle=True, num_workers=4)

    def val_dataloader(self):
        return DataLoader(self.val_dataset, batch_size=self.batch_size, shuffle=False, num_workers=4)

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

    transform = transforms.Compose([
        transforms.Resize((CROP_SIZE, CROP_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize((0.5,), (0.5,))
    ])

    data_module = ImageDataModule(data_dir=os.path.join(args.dataset_dir, 'data'), batch_size=32, transform=transform, val_proportion=0.3)

    model=PixelDiffusion(
                         max_steps=max_steps,
                         lr=learning_rate,
                         batch_size=batch_size,
                         num_timesteps=num_timesteps,
                         sample_shape=(CROP_SIZE,CROP_SIZE))

    trainer = pl.Trainer(
        default_root_dir=os.path.join(args.training_dir),
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

    trainer.fit(model=model, datamodule=data_module)
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
