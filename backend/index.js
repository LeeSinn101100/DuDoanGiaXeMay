const pythonInterpreter = require('./build/Release/Processing.node')
console.log(pythonInterpreter.Hello())
console.log(pythonInterpreter.Execute('print(\'Hello, World from Python!\')'))

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

readline.question(``, str => {
  if(str != 'exit()') return

  pythonInterpreter.DeInitialize()
  process.exit()
})

const express = require('express')
const app = express()
const PORT = 3000
const HOST = 'localhost'

const cors = require("cors");
const corsOptions ={
   origin :'*', 
   credentials :true,            //access-control-allow-credentials:true
   optionSuccessStatus :200,
}
app.use(cors(corsOptions))
app.use(express.json())

const fs = require('fs')
const htmlFrontEndRaw = fs.readFileSync('../frontend/index.html').toString()
const html = htmlFrontEndRaw.replace(/http:localhost:3000/g, `http://${HOST}:${PORT}`)

app.get('/', (req, res) => {
  res.send(html)
})

app.post('/predict', (req, res) => {
  const data = req.body
  const str = `
values = [
  '${data.isused}', 
  '${data.brand}', 
  '${data.model}', 
  ${data.kms}, 
  '${data.type}', 
  ${data.year},
  ${data.capacity}, 
  '${data.province}'
]
print(predict(values))
  `
  const ret = pythonInterpreter.Execute(str)
  
  res.send(JSON.stringify({
    price: ret
  }))
})

app.listen(PORT, HOST, () => {
  console.log(`[LOG]: server is listening at http://${HOST}:${PORT}`)
  main()
})

function init() {
  const ret = pythonInterpreter.Execute(`
from tensorflow import keras
import pandas as pd
import json
# import textdistance
import re
from collections import Counter
import numpy as np
from joblib import dump, load

model = load('./python/best_model.h5')
sc = load('./python/std_scaler.bin')
with open('./python/model_features.json', 'r', encoding='utf8') as f: 
  model_features = json.load(f)
with open('./python/categorical_features.json', 'r', encoding='utf8') as f: 
  categorical_features = json.load(f)

keys = ['isused', 'brand', 'model', 'kms', 'type', 'year', 'capacity', 'province']

# Hàm dự đoán giá
def predict(values):
  # Sửa lỗi chính tả ở đây
  res = dict(zip(keys, values))
  input = np.zeros(len(model_features))
  for key in res:
    if (key == 'kms') or (key == 'capacity'):
      idx = model_features[key]
      input[idx] = res[key]
    elif key == 'year':
      idx = model_features[key]
      input[idx] = 2021 - res[key]
    else:
      idx = model_features['_'.join([key, res[key]])]
      input[idx] = 1
  input = input.reshape(1, -1)
  x = sc.transform(input)
  y = model.predict(x)[0]
  return np.exp(y)
  `
  )

  console.log(ret)
}

function main() {
  init()
}