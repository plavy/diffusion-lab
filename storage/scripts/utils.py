import json
import importlib

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
