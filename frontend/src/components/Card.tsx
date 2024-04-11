import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import emoji from 'remark-gemoji';
import IconButton from './IconButton'
import MarkDownExtensions from './MarkdownExtensions'

export default function Card({ children, setEditingCardId, setEditingCardName, id }: {
  children?: React.ReactNode,
  name?: string,
  id?: string,
  setEditingCardId?: (id: string) => void
  setEditingCardName?: (name: string) => void,
}
) {
  const content = typeof children === 'string' ? children : JSON.stringify(children);

  return <>
    <Markdown
      remarkPlugins={[remarkGfm, emoji]}
      rehypePlugins={[rehypeRaw]}
      components={MarkDownExtensions()}>
      {content}
    </Markdown>
    {!!setEditingCardId && <IconButton icon="material-symbols:edit" onClick={() => setEditingCardId(id || "")} />}
  </>
}
