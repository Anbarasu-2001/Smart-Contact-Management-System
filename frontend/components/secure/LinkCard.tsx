"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";

export default function LinkCard({ link, onExtend, onRevoke }: any) {
  const isExpired = !link.isActive || new Date(link.expiresAt) <= new Date();

  return (
    <Card
      className={` border ${isExpired ? " border-slate-700 opacity-70" : "glass-panel-strong border-cyan-500/40 neon-border"}`}
    >
      <CardBody className="flex flex-row justify-between items-center px-4 py-3">
        <div>
          <h3
            className={`font-semibold text-lg ${isExpired ? "text-gray-500" : "bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"}`}
          >
            Secure Call Link
          </h3>
          <p className="text-sm app-muted">
            Token: {link.token.substring(0, 8)}...
          </p>
          <p className="text-xs text-gray-500">
            {isExpired
              ? "Expired"
              : `Expires: ${new Date(link.expiresAt).toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isExpired && (
            <>
              <Button
                className="bg-cyan-500/20 text-indigo-500"
                size="sm"
                onPress={() =>
                  navigator.clipboard.writeText(
                    `http://localhost:3000/secure-call/${link.token}`,
                  )
                }
              >
                Copy URL
              </Button>
              <Button
                className="bg-blue-500/20 text-blue-300"
                size="sm"
                onPress={() => onExtend(link.token)}
              >
                +30 Min
              </Button>
              <Button
                color="danger"
                size="sm"
                variant="flat"
                onPress={() => onRevoke(link.token)}
              >
                Revoke
              </Button>
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
