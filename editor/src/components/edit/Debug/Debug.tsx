import { ValSetContext } from "@/contexts/ValSetContext";
import { useContext } from "react";

/** Inplace Shows the Current Context val as JSON */
export function Debug() {
  const { val } = useContext(ValSetContext);
  const repr = JSON.stringify(val, null, 4);
  return (
    <div>
      <pre>{repr}</pre>
    </div>
  );
}
