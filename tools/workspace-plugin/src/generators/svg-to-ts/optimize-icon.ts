import {
  AddAttributesToSVGElementPlugin,
  optimize,
  OptimizedSvg,
  Plugin,
} from 'svgo';
import { SvgOptions } from './iconsets';

export async function optimizeIcon(
  svg: string,
  options?: SvgOptions,
): Promise<string> {
  const plugins = [
    { name: 'removeComments' },
    {
      name: 'insertCssVariables',
      type: 'visitor',
      description: 'Insert CSS variables',
      params: {},
      fn: function () {
        return {
          element: {
            enter: node => {
              if (node.name === 'svg') {
                delete node.attributes['width'];
                delete node.attributes['height'];
              } else {
                // if this is not the svg element remove the stroke property
                if (options?.removeStroke && node.attributes['stroke-width']) {
                  delete node.attributes['stroke'];
                }
              }

              if (options?.removeColor) {
                if (node.name === 'svg') {
                  node.attributes['fill'] = 'currentColor';
                } else if (node.attributes['fill']) {
                  delete node.attributes['fill'];
                }

                if (node.attributes['color']) {
                  delete node.attributes['color'];
                }

                if (node.attributes['stroke']) {
                  node.attributes['stroke'] = 'currentColor';
                }

                if (node.attributes['style']) {
                  const style = node.attributes['style']
                    .replace(/fill\s*:.*?(?:;|$)/g, '')
                    .replace(/stroke\s*:.*?(?:;|$)/g, 'stroke:currentColor;')
                    .replace(/color\s*:.*?(?:;|$)/g, '')
                    .trim();
                  if (style.length === 0) {
                    delete node.attributes['style'];
                  } else {
                    node.attributes['style'] = style;
                  }
                }
              }

              if (node.attributes['stroke-width']) {
                node.style.setProperty(
                  'stroke-width',
                  `var(--ng-icon__stroke-width, ${node.attributes['stroke-width']})`,
                  '',
                );

                delete node.attributes['stroke-width'];
              }

              // remove any classes
              if (node.attributes['class']) {
                delete node.attributes['class'];
              }

              // tdesign icons have a view-box attribute, which should be viewBox, we should rename it
              if (node.attributes['view-box']) {
                node.attributes['viewBox'] = node.attributes['view-box'];
                delete node.attributes['view-box'];
              }
            },
          },
        };
      },
    } as Plugin,
  ];

  if (options?.colorAttr) {
    plugins.push({
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [
          {
            [options!.colorAttr]: 'currentColor',
          },
        ],
      },
    } as AddAttributesToSVGElementPlugin);
  }

  const result = await optimize(svg, { plugins: plugins as Plugin[] });

  if (result.error) {
    throw result.error;
  }

  return (result as OptimizedSvg).data;
}
