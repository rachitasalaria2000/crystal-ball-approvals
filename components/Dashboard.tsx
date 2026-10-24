"use client";
import React, { useState } from "react";
import queue from "../data/queue.json";
import { AssistantPanel } from "./AssistantPanel";
export function Dashboard() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(queue[0]);
  return (
    <>
      <header className="topbar">
        <a className="brand" href="/">
          Oomni<span>Eye</span>
          <small>DIGITAL TWIN SOLUTIONS</small>
        </a>
        <div className="workspace-label">
          CRYSTAL BALL <span>/</span> COMMAND CENTRE
        </div>
        <div className="top-right">
          <span className="live-dot" /> Workspace online{" "}
          <span className="user-avatar">R</span>
        </div>
      </header>
      <nav className="rail" aria-label="Workspace">
        <span>◫</span>
        <span className="active">▦</span>
        <span>♧</span>
        <span>▣</span>
        <span>⌘</span>
      </nav>
      <main className="dashboard">
        <div className="breadcrumb">
          Workspace <span>/</span> Operations <span>/</span>{" "}
          <b>Approvals & Review</b>
        </div>
        <div className="page-title">
          <div>
            <p className="eyebrow">OPERATOR WORKSPACE</p>
            <h1>
              Approvals & Review<span className="count">04</span>
            </h1>
            <p className="muted">
              A clear view of what’s waiting for your attention.
            </p>
          </div>
          <span className="date-label">● &nbsp; Sample workspace</span>
        </div>
        <div className="metrics">
          <div>
            <span>Pending review</span>
            <strong>
              04 <small>items in queue</small>
            </strong>
          </div>
          <div>
            <span>Content types</span>
            <strong>
              04 <small>across your workspace</small>
            </strong>
          </div>
          <div>
            <span>Review status</span>
            <strong className="amber">
              Awaiting action <small>All items pending</small>
            </strong>
          </div>
        </div>
        <section className="queue-panel">
          <div className="section-head">
            <h2>
              <span className="purple">☷</span> Pending approval requests{" "}
              <span className="pill">4 items</span>
            </h2>
            <span className="view-label">▤ &nbsp; Queue view</span>
          </div>
          <div className="search-row">
            <span>⌕</span>
            <input
              aria-label="Search approvals"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or content type…"
            />
            <span className="search-hint">4 pending</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>FOLDER / CONTENT NAME</th>
                  <th>TYPE</th>
                  <th>SUBMITTED BY</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {queue
                  .filter((i) =>
                    (i.title + i.submittedBy + i.type)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((item) => (
                    <tr
                      key={item.id}
                      className={item.id === selected.id ? "selected" : ""}
                      onClick={() => setSelected(item)}
                    >
                      <td>
                        <button
                          className="item-button"
                          onClick={() => setSelected(item)}
                        >
                          <span className={"file-icon " + item.id}>
                            {
                              {
                                patrol: "▱",
                                drone: "▻",
                                safety: "▤",
                                spatial: "▧",
                              }[item.id]
                            }
                          </span>
                          <span>
                            <strong>{item.title}</strong>
                            <small>My Site Patrol › Site recordings</small>
                          </span>
                        </button>
                      </td>
                      <td>
                        <span className="type-tag">{item.type}</span>
                      </td>
                      <td>{item.submittedBy}</td>
                      <td>{item.submittedDate}</td>
                      <td>
                        <span className="pending">Pending Review</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!queue.some((i) =>
            (i.title + i.submittedBy + i.type)
              .toLowerCase()
              .includes(search.toLowerCase()),
          ) && <p className="empty">No matching approvals.</p>}
          <div className="queue-bottom">
            Showing sample queue · 4 pending approvals{" "}
            <span>No severity or due dates supplied</span>
          </div>
        </section>
        <section className="detail-panel">
          <div>
            <p className="eyebrow">
              SELECTED ITEM / {selected.type.toUpperCase()}
            </p>
            <h2>{selected.title}</h2>
            <p>
              Submitted by {selected.submittedBy} · {selected.submittedDate}
            </p>
          </div>
          <div className="detail-note">
            <span>ⓘ</span>
            <p>
              This assessment contains queue metadata only. Open and verify the
              source evidence in the operational system before making a
              decision.
            </p>
          </div>
        </section>
        <p className="workspace-footer">
          OomniEye · Crystal Ball Command Centre{" "}
          <span>Approvals are advisory in this sample workspace</span>
        </p>
      </main>
      <AssistantPanel />
    </>
  );
}
