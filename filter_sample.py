import json

with open('result_yahoo.json', 'r') as f:
    data = json.load(f)

label_id = set()

for i in range(len(data)-1,len(data)):
    tmp = data[i]['apply_train']
    for idx in range(len(tmp)):
        # here's each example
        for j in range(len(tmp[idx])):
            if tmp[idx][j] != -1:
                label_id.add(idx)

print(len(label_id))

exit()

not_label_id = [i for i in range(len(data[0]['apply_train'])) if i not in label_id]

# randomly drop 5000 examples from not_label_id
import random
random.seed(123)
random.shuffle(not_label_id)
not_label_id = not_label_id[:5000]

# read the original data
import pandas as pd
df_train = pd.read_csv('yahoo.csv', sep='\t')

# drop the examples
df_train = df_train.drop(df_train.index[not_label_id])

# save the new data
df_train.to_csv('yahoo_15000.csv', sep='\t', index=False)

        
        