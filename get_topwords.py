import pandas as pd
import collections
# use bayes to get top words in each category

# country|countries|nation|nations|nationwide|global|worldwide|world
restriction = ['list']

words_appear = collections.defaultdict(int)
words_appear_in_category = collections.defaultdict(lambda: collections.defaultdict(int))

f = open('yahoo.csv', 'r')
lines = f.readlines()
for line in lines[:20000]:
    line = line.strip()
    label = line.split('\t')[0]
    text = line.split('\t')[1]
    words = text.lower().split(' ')
    if len(restriction) > 0:
        import re
        if not (re.search('|'.join(restriction), text.lower()) ):
            continue
    for word in set(words):
        words_appear[word] += 1
        words_appear_in_category[label][word] += 1

for label in sorted(words_appear_in_category.keys()):
    for word in words_appear_in_category[label]:
        words_appear_in_category[label][word] = words_appear_in_category[label][word] / words_appear[word]
    # sort by value
    label_top_words = sorted(words_appear_in_category[label].items(), key=lambda x: x[1], reverse=True)
    final_top_words = []
    for word in label_top_words:
        tf = words_appear[word[0]]
        if word[1] > 0.01 and tf > 10:
            final_top_words.append((word[0], word[1], tf))
    print(label, final_top_words[:10])
    




