import torch
print(torch.cuda.is_available())       # 👉 True 나오면 GPU 사용 가능!
print(torch.cuda.get_device_name(0))   # 👉 GPU 이름 출력됨
