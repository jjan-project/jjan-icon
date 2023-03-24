const fs = require("fs");
const path = require("path");
const { transform } = require("@svgr/core");
const { format } = require("prettier");
const { pascalCase } = require("../utils/string");
const { rootPath } = require("../utils/dir");

const iconsDir = path.resolve(rootPath, "icons");
const outputDir = path.resolve(rootPath, "components");
const indexPath = path.resolve(outputDir, "index.ts");

fs.readdir(iconsDir, (err, files) => {
  if (err) {
    console.error("Error reading icons directory:", err);
    return;
  }

  let importStatements = "";
  let exportComponents = [];

  files.forEach((file) => {
    if (!file.endsWith(".svg")) {
      return;
    }

    fs.readFile(path.resolve(iconsDir, file), "utf8", async (err, data) => {
      if (err) {
        console.error(`Error reading ${file}:`, err);
        return;
      }

      const componentName = `Icon${pascalCase(file.replace(/\.svg$/, ""))}`;
      const componentCode = await transform(
        data,
        {
          typescript: true,
          icon: true,
          svgo: true,
        },
        { componentName }
      );

      const componentPath = path.resolve(outputDir, `${componentName}.tsx`);
      fs.writeFile(
        componentPath,
        format(componentCode, { parser: "typescript" }),
        (err) => {
          if (err) {
            console.error(`Error writing ${componentName}.tsx:`, err);
          }
        }
      );

      // Update index.ts
      importStatements += `import ${componentName} from './${componentName}';\n`;
      exportComponents.push(componentName);
    });
  });

  // Wait for all file operations to complete
  setTimeout(() => {
    const newIndexContent =
      importStatements + "\n" + `export { ${exportComponents.join(", ")} };\n`;

    fs.writeFile(indexPath, newIndexContent, (err) => {
      if (err) {
        console.error(`Error writing index.ts:`, err);
      }
    });
  }, 2000);
});
