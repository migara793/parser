import { useState, useEffect } from "react";
import { Box, Button, TextField, Typography, Paper, Grid, Chip, List, ListItemButton, ListItemText, ListItemSecondaryAction, CircularProgress } from "@mui/material";
import { Plus, Briefcase, CheckCircle2 } from "lucide-react";
import { createJob, fetchJobs, JobDescription } from "../api/client";

export const JobManager = ({ onJobCreated, selectedJobId }: { onJobCreated: (id: string) => void, selectedJobId: string | null }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minExp, setMinExp] = useState<number>(0);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [preferredSkills, setPreferredSkills] = useState<Record<string, number>>({});
  const [preferredSkill, setPreferredSkill] = useState("");
  const [preferredWeight, setPreferredWeight] = useState(5);
  const [minDegree, setMinDegree] = useState("");
  const [locationPreference, setLocationPreference] = useState("");
  const [shortlistThreshold, setShortlistThreshold] = useState(0.7);
  const [holdThreshold, setHoldThreshold] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [fetchingJobs, setFetchingJobs] = useState(false);

  const loadJobs = async () => {
    setFetchingJobs(true);
    try {
      const data = await fetchJobs();
      setJobs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setFetchingJobs(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleAddSkill = () => {
    const skill = newSkill.trim();
    if (skill && !requiredSkills.some((existing) => existing.toLowerCase() === skill.toLowerCase())) {
      setRequiredSkills([...requiredSkills, skill]);
      setNewSkill("");
    }
  };

  const handleAddPreferredSkill = () => {
    const skill = preferredSkill.trim();
    if (skill) {
      setPreferredSkills({ ...preferredSkills, [skill]: preferredWeight });
      setPreferredSkill("");
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const job: Partial<JobDescription> = {
        title,
        description,
        rules: {
          min_years_experience: minExp,
          required_skills: requiredSkills,
          preferred_skills: preferredSkills,
          min_degree: minDegree.trim() || undefined,
          location_preference: locationPreference.trim() || undefined,
          shortlist_threshold: shortlistThreshold,
          hold_threshold: holdThreshold,
        },
      };
      const res = await createJob(job);
      onJobCreated(res.job_id);
      loadJobs();
      alert("Job created and stored in knowledge base!");
    } catch (e) {
      console.error(e);
      alert("Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={7}>
        <Paper className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-brand-500/10 rounded-2xl text-brand-500">
              <Briefcase className="h-6 w-6" />
            </div>
            <Typography variant="h5" className="!font-bold">Define New Job</Typography>
          </div>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Fullstack Engineer"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Job Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste the full job description here..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Min Experience (Years)"
                value={minExp}
                onChange={(e) => setMinExp(Number(e.target.value))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Degree"
                value={minDegree}
                onChange={(e) => setMinDegree(e.target.value)}
                placeholder="e.g. B.Sc."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location Preference"
                value={locationPreference}
                onChange={(e) => setLocationPreference(e.target.value)}
                placeholder="e.g. Colombo or Remote"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" className="mb-2">Required Skills</Typography>
              <div className="flex gap-2 mb-3">
                <TextField
                  size="small"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                />
                <Button variant="outlined" onClick={handleAddSkill} startIcon={<Plus />}>Add</Button>
              </div>
              <Box className="flex flex-wrap gap-2">
                {requiredSkills.map(s => (
                  <Chip key={s} label={s} onDelete={() => setRequiredSkills(requiredSkills.filter(sk => sk !== s))} />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" className="mb-2">Preferred Skills and Weights</Typography>
              <div className="flex flex-wrap gap-2 mb-3">
                <TextField
                  size="small"
                  value={preferredSkill}
                  onChange={(e) => setPreferredSkill(e.target.value)}
                  placeholder="e.g. Docker"
                  onKeyPress={(e) => e.key === "Enter" && handleAddPreferredSkill()}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Weight"
                  value={preferredWeight}
                  onChange={(e) => setPreferredWeight(Math.min(10, Math.max(1, Number(e.target.value))))}
                  inputProps={{ min: 1, max: 10 }}
                  sx={{ width: 110 }}
                />
                <Button variant="outlined" onClick={handleAddPreferredSkill} startIcon={<Plus />}>Add</Button>
              </div>
              <Box className="flex flex-wrap gap-2">
                {Object.entries(preferredSkills).map(([skill, weight]) => (
                  <Chip
                    key={skill}
                    label={`${skill} · ${weight}/10`}
                    onDelete={() => {
                      const next = { ...preferredSkills };
                      delete next[skill];
                      setPreferredSkills(next);
                    }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" className="mb-2">Score Thresholds</Typography>
              <Typography variant="caption" color="text.secondary" className="block mb-2">
                Scores are between 0 and 1. Hard rule failures are always rejected.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Shortlist threshold"
                    value={shortlistThreshold}
                    onChange={(e) => setShortlistThreshold(Number(e.target.value))}
                    inputProps={{ min: 0, max: 1, step: 0.05 }}
                    error={holdThreshold > shortlistThreshold}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Hold threshold"
                    value={holdThreshold}
                    onChange={(e) => setHoldThreshold(Number(e.target.value))}
                    inputProps={{ min: 0, max: 1, step: 0.05 }}
                    error={holdThreshold > shortlistThreshold}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCreate}
                disabled={loading || !title || !description || holdThreshold > shortlistThreshold}
                className="!rounded-2xl !py-3 !bg-brand-500 hover:!bg-brand-600"
              >
                {loading ? "Creating..." : "Save to Knowledge Base"}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={5}>
        <Paper className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900/50 h-full">
          <div className="flex items-center justify-between mb-6">
            <Typography variant="h6" className="!font-bold">Existing Jobs</Typography>
            <Button size="small" onClick={loadJobs}>Refresh</Button>
          </div>

          {fetchingJobs ? (
            <Box className="flex justify-center p-8">
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List className="max-h-[500px] overflow-auto">
              {jobs.map((job) => (
                <Box key={job.job_id}>
                  <ListItemButton 
                    onClick={() => onJobCreated(job.job_id)}
                    selected={selectedJobId === job.job_id}
                    className={`rounded-xl mb-2 transition-colors ${selectedJobId === job.job_id ? '!bg-brand-500/10' : ''}`}
                  >
                    <ListItemText 
                      primary={<Typography className="!font-bold">{job.title}</Typography>}
                      secondary={
                        <Typography variant="caption" color="text.secondary" className="line-clamp-1">
                          {job.job_id}
                        </Typography>
                      }
                    />
                    {selectedJobId === job.job_id && (
                      <ListItemSecondaryAction>
                        <CheckCircle2 className="h-5 w-5 text-brand-500 mr-2" />
                      </ListItemSecondaryAction>
                    )}
                  </ListItemButton>
                </Box>
              ))}
              {jobs.length === 0 && (
                <Typography color="text.secondary" className="text-center py-8">No jobs found in knowledge base.</Typography>
              )}
            </List>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};
