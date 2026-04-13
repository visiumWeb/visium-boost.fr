import mongoose from "mongoose";

// Un "Spin" = une personne qui a tourné la roue d'une entreprise
// Le winCode est généré APRÈS la roue, pas avant
const SpinSchema = new mongoose.Schema(
  {
    entrepriseId: { type: mongoose.Schema.Types.ObjectId, ref: "Entreprise", required: true },
    winCode: { type: String, required: true, unique: true }, // ex: "WIN-AB3K-9F2X"
    rewardName: { type: String, required: true },           // ex: "Dessert offert"
    rewardIndex: { type: Number, default: 0 },
    validated: { type: Boolean, default: false },           // le patron a validé en physique
    validatedAt: { type: Date, default: null },
    // optionnel : infos pour traçabilité
    ip: { type: String, default: "" },
  },
  { timestamps: true }
);

SpinSchema.index({ entrepriseId: 1, createdAt: -1 });
SpinSchema.index({ winCode: 1 }, { unique: true });

export default mongoose.models.Spin || mongoose.model("Spin", SpinSchema);
