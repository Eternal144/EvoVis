import pandas as pd

data = pd.read_csv('./data/yahoo.csv', header=0, delimiter='\t', encoding='unicode_escape')

print(data['text'][0])
l = 0
for text in data['text']:
    l = l + len(text.split())
print(l/len(data))
print(len(data))