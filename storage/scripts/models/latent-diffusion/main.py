from .src.LatentDiffusion import LatentDiffusion
from .src.EMA import EMA

def construct(hyperparameters, sample_shape):
  return LatentDiffusion(
    max_steps=int(hyperparameters.get('max-steps')),
    lr=float(hyperparameters.get('learning-rate')),
    num_timesteps=int(hyperparameters.get('diffusion-timestamps')),
    latent_scale_factor=float(hyperparameters.get('latent-scale-factor')),
    sample_shape=sample_shape
  )

def get_class():
  return LatentDiffusion

def callbacks():
  return [EMA(0.9999)]