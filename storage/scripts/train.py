import os
import argparse
import traceback
import time

from webdav3.client import Client
import torch
from torchvision import transforms
import pytorch_lightning as pl

from ProgressUpdater import ProgressUpdater
from utils import ImageDataModule
from utils import get_metadata, set_metadata, load_downsizing, load_augmentation, load_model

def train(args):

    print(f'Args: {args}')

    # Read training metadata (including hyperparameters)
    metadata = get_metadata(args.metadata_file)
    print(f'Metadata: {metadata}')

    # Set up WebDAV connection
    dav = Client({
        'webdav_hostname': args.dav_url,
        'webdav_login':    args.dav_username,
        'webdav_password': args.dav_password,
    })

    set_metadata(args.metadata_file, "trainingProgress", 0)
    set_metadata(args.metadata_file, "uploadDone", False)
    set_metadata(args.metadata_file, "error", "")
    dav.upload_sync(local_path=args.training_dir, remote_path=args.training_dir)

    try:
        crop_x = int(metadata.get('shape').split('x')[0])
        crop_y = int(metadata.get('shape').split('x')[1])
        augmentations = [key for key, value in metadata.get('augmentations').items() if value]

        transform = transforms.Compose([
            load_downsizing(metadata.get('downsizing')).construct(crop_x, crop_y),
            transforms.ToTensor(),
        ] + [load_augmentation(id).construct() for id in augmentations])

        val_proportion = float(metadata.get('validationSplitProportion'))
        data_module = ImageDataModule(data_dir=os.path.join(args.dataset_dir, 'data'), batch_size=32, transform=transform, val_proportion=val_proportion)

        hyperparameters = metadata.get('hyperparameters')
        model = load_model(metadata.get('model')).construct(hyperparameters, (crop_x, crop_y))
        callbacks = load_model(metadata.get('model')).callbacks()

        print(torch.cuda.is_available())  # Should print True
        print(torch.cuda.device_count())  # Should print at least 1

        trainer = pl.Trainer(
            default_root_dir=os.path.join(args.training_dir),
            max_steps=model.max_steps,
            callbacks=callbacks+[ProgressUpdater(args)],
            accelerator='gpu',
            devices=1
        )

        trainer.fit(model=model, datamodule=data_module)
        # Chekpoints are saved automatically
        print('Training ended. Model saved locally.')

        print('Uploading model to WebDAV server')
        for filename in os.listdir(args.training_dir):
            file_path = os.path.join(args.training_dir, filename)
            try:
                dav.upload_sync(local_path=file_path, remote_path=file_path)
            except:
                # Try again in case of error
                time.sleep(4)
                dav.upload_sync(local_path=file_path, remote_path=file_path)
                time.sleep(2)

        # Mark training as done
        set_metadata(args.metadata_file, "uploadDone", True)
        dav.upload_sync(local_path=args.metadata_file, remote_path=args.metadata_file)
        print('Done.')
    except Exception as e:
        traceback.print_exc()
        set_metadata(args.metadata_file, "error", str(e))
        print('Uploading error metadata')
        dav.upload_sync(local_path=args.training_dir, remote_path=args.training_dir)
        print('Done.')


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train a model")
    parser.add_argument("--dav-url", required=True, help="URL of WebDAV server")
    parser.add_argument("--dav-username", required=True, help="Username for WebDAV server")
    parser.add_argument("--dav-password", required=True, help="Password for WebDAV server")
    parser.add_argument("--dataset-dir", required=True, help="Path to dataset directory")
    parser.add_argument("--training-dir", required=True, help="Path to traning session directory")
    parser.add_argument("--metadata-file", required=True, help="Path to training definition file")
    
    args = parser.parse_args()
    train(args)
