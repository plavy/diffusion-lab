import os
import argparse

from torchvision import transforms
import pytorch_lightning as pl

from ProgressUpdater import ProgressUpdater
from utils import ImageDataModule
from utils import get_metadata, load_downsizing, load_augmentation

def preview(args):

    print(f'Args: {args}')

    # Read training metadata
    metadata = get_metadata(args.metadata_file)
    print(f'Metadata: {metadata}')

    shape_x = int(metadata.get('shape').split('x')[0])
    shape_y = int(metadata.get('shape').split('x')[1])
    augmentations = [key for key, value in metadata.get('augmentations').items() if value]

    transform = transforms.Compose([
        load_downsizing(metadata.get('downsizing')).construct(shape_x, shape_y),
        transforms.ToTensor(),
    ] + [load_augmentation(id).construct() for id in augmentations])

    val_proportion = float(metadata.get('validationSplitProportion'))
    data_module = ImageDataModule(data_dir=os.path.join(args.dataset_dir, 'data'), batch_size=32, transform=transform, val_proportion=val_proportion)
    data_module.setup()
    train_dataset = data_module.train_dataloader().dataset
    out_transform = transforms.ToPILImage()

    batch_size = int(args.number)
    for i in range(batch_size):
        pil_img = out_transform(train_dataset[i])
        pil_img.save(os.path.join(args.save_dir, f'{i}.jpg'))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preview training samples")
    parser.add_argument("--dataset-dir", required=True, help="Path to dataset directory")
    parser.add_argument("--save-dir", required=True, help="Directory to save images")
    parser.add_argument("--metadata-file", required=True, help="Path to training definition file")
    parser.add_argument("--number", required=True, help="Number of images")

    args = parser.parse_args()
    preview(args)
