from torchvision import transforms

def downsize(x, y):
  return transforms.Resize((x, y))