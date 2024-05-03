import { transform } from '@svgr/core';

import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'path';

import { rootPath } from '../utils/dir.js';
import { toPascalCase } from '../utils/string.js';

const iconDir = resolve(rootPath, "icons")
const outputDir = resolve(rootPath, "components");

let importStatements = "";
let exportComponents = [];

const cacheFilePath = await readFile(resolve(rootPath, "cache", "cache-map.json"));
const cacheMap = JSON.parse(cacheFilePath);

const files = await readdir(iconDir);

for (const file of files) {
  if (cacheMap[file]) {
    console.log("cache hit", file);
  } else {
    console.log("cache miss", file);

    if (file.endsWith(".svg")) {
      const data = await readFile(resolve(iconDir, file), "utf-8", (err) => {
        console.error(`Error reading ${file}:`, err);
      });
  
      const name = `Icon${toPascalCase(file.replace(/\.svg$/, ""))}`;
      const component = await transform(
        data,
        {
          typescript: true,
          icon: true,
          svgo: true
        },
        { componentName: name }
      )
  
      const path = resolve(outputDir, `${name}.tsx`);
      
      cacheMap[file] = name;

      writeFile(path, component, (err) => {
        console.error(`Error writing ${name}.tsx:`, err);
      });
  
      importStatements += `import ${name} from './${name}';\n`;
      exportComponents.push(name);
    }
  }
}

writeFile(resolve(rootPath, "cache", "cache-map.json"), JSON.stringify(cacheMap), (err) => {
  console.error(`Error updating cache:`, err);
});