import Link from "next/link";

import type { Person } from "@/lib/db-types";
import type { FamilyMember } from "@/lib/people";
import { cn } from "@/lib/utils";

import { PersonAvatar } from "./avatar";

type Node = { person: Person; label?: string; self?: boolean };

function TreeNode({ node, photos }: { node: Node; photos: Map<string, string> }) {
  const content = (
    <>
      <PersonAvatar
        person={node.person}
        photoUrl={node.person.photo_path ? photos.get(node.person.photo_path) : null}
        className={cn(
          "h-14 w-14 rounded-full text-base shadow-soft ring-[3px] sm:h-16 sm:w-16 sm:text-lg",
          node.self ? "ring-navy-700" : "ring-white",
        )}
      />
      {node.label && <span className="mt-2 text-[11px] font-semibold text-ink-soft">{node.label}</span>}
      <span className={cn("line-clamp-2 text-xs leading-snug font-semibold text-ink", node.self ? "mt-2" : "mt-0.5")}>
        {node.person.nickname || node.person.full_name}
      </span>
    </>
  );

  return (
    <li className="w-[5.5rem] sm:w-24">
      {node.self ? (
        <div className="flex flex-col items-center text-center">{content}</div>
      ) : (
        <Link
          href={`/admin/jemaat/${node.person.id}`}
          className="flex flex-col items-center rounded-2xl p-1.5 text-center transition hover:bg-cream-100"
        >
          {content}
        </Link>
      )}
    </li>
  );
}

function Row({ nodes, photos }: { nodes: Node[]; photos: Map<string, string> }) {
  return (
    <ul className="flex flex-wrap items-start justify-center gap-x-2 gap-y-3">
      {nodes.map((node) => (
        <TreeNode key={node.person.id} node={node} photos={photos} />
      ))}
    </ul>
  );
}

/** Garis penghubung antargenerasi. */
function Link_() {
  return <div aria-hidden="true" className="mx-auto h-5 w-px bg-navy-700/20" />;
}

/**
 * Keluarga dalam tiga generasi: orang tua di atas, dia bersama pasangan dan
 * saudaranya di tengah (kakak di kiri, adik di kanan), anak-anak di bawah.
 */
export function FamilyTree({
  viewer,
  members,
  photos,
}: {
  viewer: Person;
  members: FamilyMember<Person>[];
  photos: Map<string, string>;
}) {
  const node = (member: FamilyMember<Person>): Node => ({ person: member.person, label: member.label });
  const parents = members.filter((member) => member.as === "orang_tua").map(node);
  const spouses = members.filter((member) => member.as === "pasangan").map(node);
  const siblings = members.filter((member) => member.as === "saudara");
  const children = members.filter((member) => member.as === "anak").map(node);

  const middle: Node[] = [
    ...siblings.filter((member) => member.label === "Kakak").map(node),
    { person: viewer, self: true },
    ...spouses,
    ...siblings.filter((member) => member.label !== "Kakak").map(node),
  ];

  return (
    <div aria-label="Pohon keluarga" role="group">
      {parents.length > 0 && (
        <>
          <Row nodes={parents} photos={photos} />
          <Link_ />
        </>
      )}
      <Row nodes={middle} photos={photos} />
      {children.length > 0 && (
        <>
          <Link_ />
          <Row nodes={children} photos={photos} />
        </>
      )}
    </div>
  );
}
