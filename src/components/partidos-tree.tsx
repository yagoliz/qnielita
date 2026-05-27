"use client";

import { MatchCard } from "./match-card";
import type {
  MatchTree,
  DefaultOpen,
  GroupNode,
  MatchdayNode,
  KnockoutNode,
} from "@/lib/match-tree";

function Chevron() {
  return (
    <svg
      className="w-4 h-4 text-gray-400 transition-transform"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 0 1 0-1.06L10.94 10 7.21 6.29a.75.75 0 1 1 1.06-1.06l4.25 4.24a.75.75 0 0 1 0 1.06l-4.25 4.24a.75.75 0 0 1-1.06 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Badge({
  predicted,
  total,
}: {
  predicted: number;
  total: number;
}) {
  const complete = predicted === total && total > 0;
  return (
    <span
      className={`text-sm font-medium ${complete ? "text-green-600" : "text-gray-400"}`}
    >
      {predicted}/{total}
    </span>
  );
}

function MatchdayDisclosure({
  matchday,
  open,
}: {
  matchday: MatchdayNode;
  open: boolean;
}) {
  return (
    <details
      open={open}
      className="[&[open]>summary>span>svg]:rotate-90"
    >
      <summary className="flex items-center justify-between pl-6 pr-2 py-2 text-sm list-none">
        <span className="flex items-center gap-2">
          <Chevron />
          <span className="text-gray-700">{matchday.label}</span>
        </span>
        <Badge predicted={matchday.predictedCount} total={matchday.totalCount} />
      </summary>
      <div className="pl-8 pr-2 pb-2 space-y-3">
        {matchday.matches.map((match) => (
          <MatchCard
            key={match.id}
            match={{
              id: match.id,
              kickoff_at: match.kickoff_at,
              venue: match.venue,
              stage: match.stage,
              home_team: match.home_team,
              away_team: match.away_team,
            }}
            prediction={match.prediction}
            result={match.result}
          />
        ))}
      </div>
    </details>
  );
}

function GroupDisclosure({
  group,
  defaultOpen,
}: {
  group: GroupNode;
  defaultOpen: DefaultOpen;
}) {
  const groupOpen = defaultOpen.groupId === group.id;
  return (
    <details
      open={groupOpen}
      className="border-b border-gray-100 [&[open]>summary>span>svg]:rotate-90"
    >
      <summary className="flex items-center justify-between px-2 py-3 list-none">
        <span className="flex items-center gap-2">
          <Chevron />
          <span className="font-semibold">{group.label}</span>
        </span>
        <Badge predicted={group.predictedCount} total={group.totalCount} />
      </summary>
      <div className="pb-2">
        {group.matchdays.map((md) => (
          <MatchdayDisclosure
            key={md.key}
            matchday={md}
            open={defaultOpen.matchdayKey === md.key}
          />
        ))}
      </div>
    </details>
  );
}

function KnockoutDisclosure({
  node,
  open,
}: {
  node: KnockoutNode;
  open: boolean;
}) {
  return (
    <details
      open={open}
      className="border-b border-gray-100 [&[open]>summary>span>svg]:rotate-90"
    >
      <summary className="flex items-center justify-between px-2 py-3 list-none">
        <span className="flex items-center gap-2">
          <Chevron />
          <span className="font-semibold">{node.label}</span>
        </span>
        <Badge predicted={node.predictedCount} total={node.totalCount} />
      </summary>
      <div className="pl-4 pr-2 pb-2 space-y-3">
        {node.matches.map((match) => (
          <MatchCard
            key={match.id}
            match={{
              id: match.id,
              kickoff_at: match.kickoff_at,
              venue: match.venue,
              stage: match.stage,
              home_team: match.home_team,
              away_team: match.away_team,
            }}
            prediction={match.prediction}
            result={match.result}
          />
        ))}
      </div>
    </details>
  );
}

export function PartidosTree({
  tree,
  defaultOpen,
}: {
  tree: MatchTree;
  defaultOpen: DefaultOpen;
}) {
  const hasGroupStage = tree.groupStage.groups.length > 0;
  const hasKnockout = tree.knockout.length > 0;

  return (
    <div>
      {hasGroupStage && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Fase de Grupos
          </h2>
          <div>
            {tree.groupStage.groups.map((group) => (
              <GroupDisclosure
                key={group.id}
                group={group}
                defaultOpen={defaultOpen}
              />
            ))}
          </div>
        </section>
      )}

      {hasKnockout && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">
            Eliminatorias
          </h2>
          <div>
            {tree.knockout.map((node) => (
              <KnockoutDisclosure
                key={node.stage}
                node={node}
                open={defaultOpen.knockoutStage === node.stage}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}