async function logHistory(
  executor,
  {
    type,
    idAsset = null,
    idUser = null,
    performedBy,
    subjectName,
    subjectCode = null,
    description,
  },
) {
  await executor.query(
    `INSERT INTO history
       (type, id_asset, id_user, performed_by, subject_name, subject_code, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [type, idAsset, idUser, performedBy, subjectName, subjectCode, description],
  );
}

module.exports = { logHistory };