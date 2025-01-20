import pytorch_lightning as pl
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader

from .DenoisingDiffusionProcess import *

class PixelDiffusion(pl.LightningModule):
    def __init__(self,
                 max_steps=2e5,
                 num_timesteps=1000,
                 lr=1e-4,
                 batch_size=16):
        super().__init__()
        self.max_steps = max_steps
        self.lr = lr
        self.batch_size = batch_size
        self.save_hyperparameters()
        
        self.model=DenoisingDiffusionProcess(num_timesteps=num_timesteps)

    @torch.no_grad()
    def forward(self,*args,**kwargs):
        return self.output_T(self.model(*args,**kwargs))
    
    def input_T(self, input):
        # By default, let the model accept samples in [0,1] range, and transform them automatically
        return (input.clip(0,1).mul_(2)).sub_(1)
    
    def output_T(self, input):
        # Inverse transform of model output from [-1,1] to [0,1] range
        return (input.add_(1)).div_(2)
    
    def training_step(self, batch, batch_idx):
        images=batch
        loss = self.model.p_loss(self.input_T(images))
        
        self.log('train_loss',loss)
        
        return loss
            
    def validation_step(self, batch, batch_idx):     
        images=batch
        loss = self.model.p_loss(self.input_T(images))
        
        self.log('val_loss',loss)
        
        return loss
            
    def configure_optimizers(self):
        return  torch.optim.AdamW(list(filter(lambda p: p.requires_grad, self.model.parameters())), lr=self.lr)