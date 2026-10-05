import { PageHeader } from '../components/PageHeader'

export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div className="page">
      <PageHeader title={title} />
      <div className="ember-card">
        <p className="soft">{note}</p>
      </div>
    </div>
  )
}
