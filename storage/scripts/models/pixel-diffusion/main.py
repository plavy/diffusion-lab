from .src.PixelDiffusion import PixelDiffusion
from .src.EMA import EMA

def construct(hyperparameters, sample_shape):
  return PixelDiffusion(
    max_steps=int(hyperparameters.get('max-steps')),
    lr=float(hyperparameters.get('learning-rate')),
    sample_shape=sample_shape
  )

def get_class():
  return PixelDiffusion

def callbacks():
  return [EMA(0.9999)]