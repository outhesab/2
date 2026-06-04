import React from "react";

export function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"settings-card"}>
      <div className={"settings-card-header"}>
        <h3 className={"settings-card-title"}>{title}</h3>
      </div>
      <div className={"settings-card-body"}>{children}</div>
    </div>
  );
}
