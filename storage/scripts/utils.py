import os
import json
import importlib

from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader, random_split
import pytorch_lightning as pl

def get_metadata(metadata_file: str):
    with open(metadata_file, 'r') as f:
        metadata = json.load(f)
    return metadata

def set_metadata(metadata_file: str, key, value):
    metadata = get_metadata(metadata_file)
    metadata[key] = value
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)

def load_downsizing(id: str):
    return importlib.import_module(f'downsizings.{id}.main')

def load_augmentation(id: str):
    return importlib.import_module(f'augmentations.{id}.main')

def load_model(id: str):
    return importlib.import_module(f'models.{id}.main')

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
    def __init__(self, data_dir, batch_size, transform, val_proportion, random_seed=None):
        super().__init__()
        self.data_dir = data_dir
        self.batch_size = batch_size
        self.transform = transform
        self.val_proportion = val_proportion
        self.random_seed = random_seed

    def setup(self, stage=None):
        dataset = ImageDataset(self.data_dir, transform=self.transform)
        if self.random_seed:
            torch.manual_seed(self.random_seed)
        
        # Compute the sizes for train and validation splits
        val_size = int(len(dataset) * self.val_proportion)
        train_size = len(dataset) - val_size

        self.train_dataset, self.val_dataset = random_split(dataset, [train_size, val_size])

    def train_dataloader(self):
        return DataLoader(self.train_dataset, batch_size=self.batch_size, shuffle=True, num_workers=4)

    def val_dataloader(self):
        return DataLoader(self.val_dataset, batch_size=self.batch_size, shuffle=False, num_workers=4)
