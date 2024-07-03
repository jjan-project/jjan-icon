import { transform } from '@svgr/core';
import { readdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { resolve } from 'path';

import { rootPath } from '../utils/dir.js';
import { toPascalCase } from '../utils/string.js';

const iconDir = resolve(rootPath, "icons");
const outputDir = resolve(rootPath, "components");
const indexPath = resolve(outputDir, "index.tsx");

let importStatements = "";
let exportComponents = [];

const cacheFilePath = await readFile(resolve(rootPath, "cache", "cache-map.json"), 'utf-8');
const cacheMap = JSON.parse(cacheFilePath);

const files = await readdir(iconDir);

try {
  await unlink(indexPath);
  console.log('Deleted existing index.tsx');
} catch (error) {
  if (error.code !== 'ENOENT') {
    console.error('Error deleting index.tsx:', error);
  }
}

for (const file of files) {
  if (cacheMap[file]) {
    console.log("cache hit", file);
    const name = cacheMap[file];
    importStatements += `import ${name} from './${name}';\n`;
    exportComponents.push(name);
  } else {
    console.log("cache miss", file);

    if (file.endsWith(".svg")) {
      const data = await readFile(resolve(iconDir, file), "utf-8");

      const name = `Icon${toPascalCase(file.replace(/\.svg$/, ""))}`;
      const component = await transform(
        data,
        {
          typescript: true,
          icon: true,
          svgo: true
        },
        { componentName: name }
      );

      const path = resolve(outputDir, `${name}.tsx`);

      cacheMap[file] = name;

      await writeFile(path, component);
      importStatements += `import ${name} from './${name}';\n`;
      exportComponents.push(name);
    }
  }
}

await writeFile(resolve(rootPath, "cache", "cache-map.json"), JSON.stringify(cacheMap, null, 2));

const indexContent = `${importStatements}\nexport { ${exportComponents.join(", ")} };\n`;

await writeFile(indexPath, indexContent);

console.log('index.tsx has been created/updated successfully');