import json
import pandas as pd
import numpy as np
import eel
import os
import spam

eel.init('web')

# labels = np.load('./data/predict_labels.npy')
# probs = np.load('./data/predict_prob.npy')

# 降维算法，目前好像需要在服务器上，等整个布到服务器上就可以整合了
@eel.expose
def get_coords():
    doc_vector = np.load('./data/yahoo.npy')
    # doc_vector = np.load('./spam/qc.npy')
    return doc_vector.tolist()
 
@eel.expose
def num2portion(data):
    for level1 in data["children"]:
        level1_size = level1["size"]
        level1["originSize"] = level1["size"]
        level2_sum = sum([level2["size"] for level2 in level1["children"]])
        for level2 in level1["children"]:
            level2["originSize"] = level2["size"]
            level2["size"] = level2["size"] / level2_sum * level1_size
            level3_sum = sum([level3["size"] for level3 in level2["children"]])
            for level3 in level2["children"]:
                level3["originSize"] = level3["size"]
                level3["size"] = level3["size"] / level3_sum * level2["size"]
            del level2["size"]
        del level1["size"]
    return data
            

eel.start('index.html', mode="chrome-app", port=8080)
# eel.start('index.html', mode="chrome-app", host="172.23.98.97", port=8080)

