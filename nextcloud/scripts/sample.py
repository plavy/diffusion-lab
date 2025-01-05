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

from kornia.utils import image_to_tensor
import kornia.augmentation as KA

CROP_SIZE = 64

def sample(args):
    if not os.path.exists(os.path.join('model.ckpt')):
        print('Model not found.')
        return

    batch_size = int(args.number)
    model = PixelDiffusion.load_from_checkpoint(checkpoint_path=os.path.join('model.ckpt'))

    model.cuda()
    out=model(batch_size=batch_size, shape=(CROP_SIZE, CROP_SIZE), verbose=False)

    transform = torchvision.transforms.ToPILImage()
    for i in range(batch_size):
        pil_img = transform(out[i].detach().cpu())
        pil_img.save("generated.jpg")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sample images from model")
    parser.add_argument("--number", required=True, help="Number of images")
    
    args = parser.parse_args()
    sample(args)
