import Playbook from "../components/Playbook.jsx";

export default function Problems() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="display text-3xl text-ink">Common problems</h1>
        <p className="mt-1 text-sm text-slate-500">
          The questions customers ask most, what to check, and a reply you can copy. Open a ticket
          to insert a reply straight into the conversation.
        </p>
      </div>
      <Playbook />
    </div>
  );
}
