const { src, dest } = require('gulp');

// Copies node icons (svg/png) into dist so n8n can render them.
function buildIcons() {
	return src('nodes/**/*.{png,svg}').pipe(dest('dist/nodes'));
}

exports['build:icons'] = buildIcons;
