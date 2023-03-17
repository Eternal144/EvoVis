import json

data = json.load(open('sunburst.json'))

def num2portion(data):
    for level1 in data["children"]:
        level1_size = level1["size"]
        level2_sum = sum([level2["size"] for level2 in level1["children"]])
        for level2 in level1["children"]:
            level2["size"] = level2["size"] / level2_sum * level1_size
            level3_sum = sum([level3["size"] for level3 in level2["children"]])
            for level3 in level2["children"]:
                level3["size"] = level3["size"] / level3_sum * level2["size"]
    return data


data = num2portion(data)

with open('sunburst_convert.json', 'w') as f:
    json.dump(data, f, indent=4)


            