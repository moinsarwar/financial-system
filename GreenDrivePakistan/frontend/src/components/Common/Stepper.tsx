interface StepperProps {
  steps: string[];
  currentIndex: number;
}

export default function Stepper({ steps, currentIndex }: StepperProps) {
  return (
    <div className="stepper">
      {steps.map((label, i) => {
        let cls = 'pending';
        if (i < currentIndex) cls = 'completed';
        else if (i === currentIndex) cls = 'active';
        return (
          <div className="step-item" key={label}>
            <div className={`step-circle ${cls}`}>{i + 1}</div>
            <div className={`step-label ${cls}`}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}
