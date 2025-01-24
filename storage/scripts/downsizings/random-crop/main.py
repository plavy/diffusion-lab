from torchvision import transforms

def downsize(x, y):
  return transforms.RandomCrop((x, y))