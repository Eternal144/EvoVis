import os
import shutil

folder_path = "./state_yahoo_test"  # 文件夹路径

folder_names = [f for f in os.listdir(folder_path) if os.path.isdir(os.path.join(folder_path, f))]
folder_names.sort(key=lambda x: int(''.join(filter(str.isdigit, x))), reverse=True)

for folder_name in folder_names:
    if any(map(str.isdigit, folder_name)):
        num = int(''.join(filter(str.isdigit, folder_name)))
        if num >= 7:
            new_folder_name = folder_name.replace(str(num), str(num+1))
            os.rename(os.path.join(folder_path, folder_name), os.path.join(folder_path, new_folder_name))