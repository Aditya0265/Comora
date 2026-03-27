import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const rules = [
  {
    n: '01',
    title: 'Come with curiosity, not a performance',
    desc: 'Comora gatherings are for people who want to genuinely engage — not network, impress, or sell. Leave the elevator pitch at the door.',
  },
  {
    n: '02',
    title: 'Respect the agenda',
    desc: 'The host sets a topic and structure. Stay on-theme. Side conversations are great — derailing the group is not.',
  },
  {
    n: '03',
    title: 'Disagree well',
    desc: 'Debate is welcome. Dismissal is not. Challenge ideas with curiosity, not contempt. The best conversations happen when people feel safe being wrong.',
  },
  {
    n: '04',
    title: 'No unsolicited pitching or selling',
    desc: 'Comora is not a marketplace. Do not use gatherings to sell products, recruit, or push agendas unrelated to the event topic.',
  },
  {
    n: '05',
    title: 'Be on time, or let the host know',
    desc: 'Small groups notice latecomers. If something comes up, message the host. Repeated no-shows will affect your standing on the platform.',
  },
  {
    n: '06',
    title: 'Zero tolerance for harassment',
    desc: 'Any form of discrimination, harassment, or intimidation — based on gender, caste, religion, ethnicity, or any other basis — will result in immediate removal.',
  },
]

export default function CodeOfConduct() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-10 transition-colors">
          <ArrowLeft size={15} /> Back to home
        </Link>

        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Code of Conduct</h1>
        <p className="text-[var(--text-secondary)] mb-10 leading-relaxed">
          Comora is built on the belief that the quality of a gathering depends entirely on
          the quality of the people in it. These rules exist to protect that quality.
        </p>

        <div className="flex flex-col gap-6">
          {rules.map(rule => (
            <div
              key={rule.n}
              className="flex gap-5 p-5 rounded-[var(--radius-xl)] border border-[var(--border)]"
              style={{ background: 'var(--bg-card)' }}
            >
              <span
                className="text-sm font-bold shrink-0 mt-0.5"
                style={{ color: 'var(--navy-800)' }}
              >
                {rule.n}
              </span>
              <div>
                <p className="font-semibold text-[var(--text-primary)] mb-1">{rule.title}</p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-10 p-6 rounded-[var(--radius-xl)]"
          style={{ background: 'var(--bg-subtle)', borderLeft: '3px solid var(--amber-500)' }}
        >
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
            "We are not just creating better dinners. We are creating better habits of thought,
            better habits of listening, and better habits of being with strangers.
            That takes a room that feels safe."
          </p>
        </div>
      </div>
    </div>
  )
}
