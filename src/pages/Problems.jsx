import Playbook from "../components/Playbook.jsx";

export default function Problems() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] text-carbon">
        Common problems
      </h1>
      <p className="mt-1 max-w-[62ch] text-sm text-muted">
        The questions merchants ask most, what to check on your side, and a reply you can copy. Open
        a ticket to drop a reply straight into the conversation.
      </p>
      <div className="mt-5">
        <Playbook hideTitle />
      </div>
    </div>
  );
}
