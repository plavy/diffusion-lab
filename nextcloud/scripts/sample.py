import sys
import os
import argparse
import time
import json
import re
import csv
from datetime import datetime

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
        print('ERROR Model not found.')
        exit(1)
        return

    os.makedirs(args.save_dir, exist_ok=True)

    batch_size = int(args.number)

    def on_progress_change(i, n):
        progress_file = os.path.join(args.save_dir, f'{args.base_name}-progress.txt')
        with open(progress_file, 'w') as f:
            f.write(str(round((n - i) / n * 100)))

    model = PixelDiffusion.load_from_checkpoint(checkpoint_path=os.path.join('model.ckpt'))
    model.cuda()
    out=model(batch_size=batch_size, shape=(CROP_SIZE, CROP_SIZE), verbose=False, progress_callback=on_progress_change)

    transform = torchvision.transforms.ToPILImage()

    for i in range(batch_size):
        pil_img = transform(out[i].detach().cpu())
        pil_img.save(os.path.join(args.save_dir, f'{args.base_name}-{i}.jpg'))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sample images from model")
    parser.add_argument("--save-dir", required=True, help="Directory to save images")
    parser.add_argument("--base-name", required=True, help="Base name of images")
    parser.add_argument("--number", required=True, help="Number of images")
    
    args = parser.parse_args()
    sample(args)
