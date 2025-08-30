#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

/**
 * Merge macOS update files from Intel and ARM builds
 * @param {string} artifactsDir - Path to the artifacts directory
 */
function mergeMacOSUpdateFiles(artifactsDir) {
  const intelFile = path.join(artifactsDir, 'macos-intel-artifacts', 'latest-mac.yml');
  const armFile = path.join(artifactsDir, 'macos-arm-artifacts', 'latest-mac.yml');
  const mergedFile = path.join(artifactsDir, 'latest-mac.yml');

  // Check if both files exist
  if (!fs.existsSync(intelFile) || !fs.existsSync(armFile)) {
    console.log('⚠️  One or both macOS update files not found, skipping merge');
    return false;
  }

  try {
    console.log('🔄 Merging macOS update files...');

    // Read and parse both YAML files
    const intelContent = fs.readFileSync(intelFile, 'utf8');
    const armContent = fs.readFileSync(armFile, 'utf8');

    const intelData = yaml.parse(intelContent);
    const armData = yaml.parse(armContent);

    // Validate that versions match
    if (intelData.version !== armData.version) {
      throw new Error(`Version mismatch: Intel (${intelData.version}) vs ARM (${armData.version})`);
    }

    // Merge the data
    const mergedData = {
      version: intelData.version,
      files: [
        ...(intelData.files || []),
        ...(armData.files || [])
      ],
      // Use ARM build as primary for path, sha512, and releaseDate
      // (assuming ARM build is more recent)
      path: armData.path,
      sha512: armData.sha512,
      releaseDate: armData.releaseDate
    };

    // Convert back to YAML
    const mergedYaml = yaml.stringify(mergedData, {
      indent: 2,
      lineWidth: 0
    });

    // Write merged file
    fs.writeFileSync(mergedFile, mergedYaml, 'utf8');

    // Remove original files
    fs.unlinkSync(intelFile);
    fs.unlinkSync(armFile);

    console.log('✅ Successfully merged macOS update files');
    console.log('📄 Merged file content:');
    console.log(mergedYaml);

    return true;
  } catch (error) {
    console.error('❌ Error merging macOS update files:', error.message);
    throw error;
  }
}

// Main execution
function main() {
  const artifactsDir = process.argv[2] || './artifacts';

  if (!fs.existsSync(artifactsDir)) {
    console.error(`❌ Artifacts directory not found: ${artifactsDir}`);
    process.exit(1);
  }

  try {
    const success = mergeMacOSUpdateFiles(artifactsDir);
    if (success) {
      console.log('🎉 macOS update files merged successfully!');
    }
  } catch (error) {
    console.error('💥 Failed to merge macOS update files:', error.message);
    process.exit(1);
  }
}

// Export for testing
module.exports = { mergeMacOSUpdateFiles };

// Run if called directly
if (require.main === module) {
  main();
}
