import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  installPackagesTask,
  joinPathFragments,
  names,
  offsetFromRoot,
  Tree
} from '@nrwl/devkit';
import {PluginGeneratorSchema} from "./schema";



interface NormalizedSchema extends PluginGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
}

function normalizeOptions(
  tree: Tree,
  options: PluginGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectName = `plugin-${name.replace(new RegExp('/', 'g'), '-')}`;
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectName}`;
  return {
    ...options,
    name,
    projectName,
    projectRoot,
    projectDirectory: name
  }
}

function addUiFiles(tree: Tree, options: NormalizedSchema, templateOptions: any) {
  const uiFiles = joinPathFragments(__dirname, 'files', 'ui');

  generateFiles(
    tree,
    uiFiles,
    options.projectRoot,
    templateOptions
  )
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    tmpl: ''
  };

  const files = joinPathFragments(__dirname, 'files', 'default');

  generateFiles(
    tree,
    files,
    options.projectRoot,
    templateOptions
  );

  if (options.withUi) {
    addUiFiles(tree, options, templateOptions);
  }
}

export default async function (tree: Tree, schema: PluginGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, schema);

  addProjectConfiguration(
    tree,
    normalizedOptions.projectName,
    {
      root: normalizedOptions.projectRoot,
      projectType: 'library',
      sourceRoot: `${normalizedOptions.projectRoot}/src`,
      targets: {
        build: {
          "executor": "@nrwl/js:tsc",
          "outputs": ["{options.outputPath}"],
          "options": {
            "outputPath": `dist/libs/${normalizedOptions.projectName}`,
            "tsConfig": `libs/${normalizedOptions.projectName}/tsconfig.lib.json`,
            "packageJson": `libs/${normalizedOptions.projectName}/package.json`,
            "main": `libs/${normalizedOptions.projectName}/src/index.ts`,
            "assets": [`libs/${normalizedOptions.projectName}/*.md`]
          }
        },
        lint: {
          "executor": "@nrwl/linter:eslint",
          "outputs": ["{options.outputFile}"],
          "options": {
            "lintFilePatterns": [`libs/${normalizedOptions.projectName}/**/*.ts`]
          }
        }
      },
      tags: ['plugin', 'vendure']
    }
  );

  addFiles(tree, normalizedOptions);
  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}
