type None = null;
type Err = Error | string | None;

type Fn<ReturnValue> = (...args: any[]) => ReturnValue | Promise<ReturnValue> | void;

type Result<V, E extends Err = None> = { ok: true; value: V } | { ok: false; error: E };

function Ok<T>(value: T): Result<T, None> {
  return {
    ok: true,
    value,
  };
}

function Err<E extends Err>(error: E): Result<None, E> {
  return {
    ok: false,
    error,
  };
}

type WhenCases<T, E> = {
  ok?: (value: T) => void | Promise<void> | T;
  error: (error: E) => void | Promise<void> | E;
};

function _toResult<V>(fn: Fn<V>) {
  try {
    return Ok(fn());
  } catch (e: unknown) {
    return Err((e as any)?.message ?? e);
  }
}

function match<V, E extends Err>(result: Result<V, E> | Fn<V>) {
  if (typeof result === "function") {
    return match(_toResult(result));
  }
  return {
    when: (cases: WhenCases<V, E>) => {
      if (!result.ok) {
        return cases.error(result.error);
      } else {
        if (cases.ok) {
          return cases.ok(result.value);
        }
        return result.value;
      }
    },

    /** @throws {Err} */
    unwrap: (): V => {
      if (!result.ok) {
        throw new Error("Failed to unwrap: " + result.error?.toString());
      } else {
        return result.value;
      }
    },

    whenOk: (fn: Fn<V>) => {
      if (!result.ok) {
        return result;
      } else {
        return Ok(fn());
      }
    },
  };
}

/* ====================================================== */

/* ====================================================== */

function isOdd(n: number) {
  if (n % 2 === 0) {
    return Err("number is even");
  }
  return Ok(n);
}

function iThrowButItIsOk() {
  throw new Error("hello, I throw but it is ok");
}

function main() {
  // the value case is optional, it is automatically returned
  let defError = match(isOdd(2)).when({
    error: (e) => `Error: ${e}` as any,
  });

  let defValue = match(isOdd(3)).when({
    ok: (v) => v,
    error: (e) => e,
  });

  console.log(defError);
  console.log(defValue);

  // mctahcing on a function that throws, needs to be wrapped in a toResult - this is done automatically
  match(iThrowButItIsOk).when({
    error: console.log,
  });

  // let idc = match(isOdd(12)).unwrap(); // this will blow up because 12 is even and we are trying to unwrap the value
}

main();
