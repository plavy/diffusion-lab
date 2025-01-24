from torchvision import transforms

def downsize(x, y):
  return transforms.CenterCrop((x, y))