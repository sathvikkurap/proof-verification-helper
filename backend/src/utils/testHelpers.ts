// Test helper functions for the application

export const testProofs = {
  simple: `theorem example : True := by trivial`,
  
  addition: `theorem add_zero (n : Nat) : n + 0 = n := by
  simp`,
  
  commutativity: `theorem add_comm (a b : Nat) : a + b = b + a := by
  induction a with
  | zero => simp
  | succ n ih => simp [add_succ, ih]`,
  
  withError: `theorem bad : Nat := by
  trivial`,
  
  complex: `theorem example_and (P Q : Prop) : P → Q → P ∧ Q := by
  intro h1 h2
  constructor
  exact h1
  exact h2`,
};

export function createTestUser() {
  return {
    email: `test${Date.now()}@example.com`,
    username: `testuser${Date.now()}`,
    password: 'testpassword123',
  };
}

