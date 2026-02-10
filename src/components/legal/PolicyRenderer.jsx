import React from "react";
import { POLICY_SECTIONS } from "./policyText";

export default function PolicyRenderer() {
  return (
    <div className="space-y-4">
      {POLICY_SECTIONS.map((section, i) => {
        switch (section.type) {
          case "title":
            return (
              <h1 key={i} className="text-2xl font-bold text-[#F4F7F5] mb-2">
                {section.text}
              </h1>
            );
          case "intro":
            return (
              <p key={i} className="text-sm text-[#B6C2BC] italic border-l-2 border-[#2BA84A]/40 pl-4">
                {section.text}
              </p>
            );
          case "heading":
            return (
              <h2 key={i} className="text-lg font-semibold text-[#F4F7F5] mt-6 mb-2">
                {section.text}
              </h2>
            );
          case "paragraph":
            return (
              <p key={i} className="text-sm leading-relaxed text-[#B6C2BC]">
                {section.text}
              </p>
            );
          case "list":
            return (
              <ul key={i} className="list-disc list-outside ml-5 space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="text-sm leading-relaxed text-[#B6C2BC]">
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "divider":
            return <hr key={i} className="border-[#223029] my-6" />;
          default:
            return null;
        }
      })}
    </div>
  );
}