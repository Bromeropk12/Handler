/**
 * pkg configuration for Handler TrackSamples backend.
 * Empaqueta la base de datos, scripts SQL, y recursos estáticos
 * dentro del ejecutable compilado.
 * 
 * Nota: los devDependencies (jest, nodemon, pkg, supertest) son excluidos
 * automáticamente por pkg cuando se especifica el entrypoint.
 */
module.exports = {
  scripts: [
    'src/index.js',
    'create_tables.js'
  ],
  assets: [
    'src/setup_page.html',
    '../database/scripts/**/*',
    '../database/insercion/**/*',
    '../recursos/**/*'
  ],
  targets: [
    'node18-win-x64'
  ],
  outputPath: 'build',
  options: {
    // Excluir módulos no compatibles con el runtime de pkg/Node18
    exclude: [
      'jest',
      'supertest',
      'nodemon'
    ]
  }
};
