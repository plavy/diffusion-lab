#!/bin/bash

python3 -m venv venv
source venv/bin/activate
export PIP_DISABLE_PIP_VERSION_CHECK=1
pip install -r requirements.txt
