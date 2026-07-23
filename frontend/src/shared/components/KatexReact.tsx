import KaTeX from 'katex'
import { Fragment, memo, useEffect, useState, type ReactNode } from 'react'

type TexState =
  | { innerHtml: string; errorElement?: undefined }
  | { innerHtml?: undefined; errorElement: ReactNode }

/**
 * 数学公式
 * @param {*} param0
 * @returns
 */
const TeX = ({
  children,
  math,
  block,
  errorColor,
  renderError,
  settings,
  as: asComponent,
  ...props
}: any): JSX.Element | null => {
  const Component = asComponent || (block ? 'div' : 'span')
  const content = (children ?? math)
  const [state, setState] = useState<TexState>({ innerHtml: '' })

  useEffect(() => {
    try {
      const innerHtml = KaTeX.renderToString(content, {
        displayMode: true,
        errorColor,
        throwOnError: !!renderError,
        ...settings
      })

      setState({ innerHtml })
    } catch (error: any) {
      if (error instanceof KaTeX.ParseError || error instanceof TypeError) {
        if (renderError) {
          setState({ errorElement: renderError(error) })
        } else {
          setState({ innerHtml: error.message })
        }
      } else {
        throw error
      }
    }
  }, [block, content, errorColor, renderError, settings])

  if ('errorElement' in state) {
    return <Fragment>{state.errorElement}</Fragment>
  }

  return (
    <Component
      {...props}
      dangerouslySetInnerHTML={{ __html: state.innerHtml }}
    />
  )
}

export default memo(TeX)
