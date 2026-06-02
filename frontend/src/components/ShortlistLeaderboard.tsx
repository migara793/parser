import { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip,
  Avatar,
  CircularProgress
} from "@mui/material";
import { Trophy, User, ArrowUpRight } from "lucide-react";
import { fetchShortlist, ShortlistResult } from "../api/client";

export const ShortlistLeaderboard = ({ job_id }: { job_id: string }) => {
  const [candidates, setCandidates] = useState<ShortlistResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchShortlist(job_id);
        setCandidates(res.candidates);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [job_id]);

  if (loading) {
    return (
      <Box className="flex justify-center p-12">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Paper className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
            <Trophy className="h-6 w-6" />
          </div>
          <Typography variant="h5" className="!font-bold">Top 10 Candidates</Typography>
        </div>
        <Chip label={`${candidates.length} Profiles Found`} variant="outlined" />
      </div>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="!font-bold">Rank</TableCell>
              <TableCell className="!font-bold">Candidate</TableCell>
              <TableCell className="!font-bold">Match Score</TableCell>
              <TableCell className="!font-bold">Key Skills</TableCell>
              <TableCell className="!font-bold">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {candidates.map((c, i) => (
              <TableRow key={c.candidate_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <TableCell>
                  <Typography className="!font-bold text-slate-400">#{i + 1}</Typography>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar sx={{ bgcolor: i === 0 ? '#06b6d4' : '#6366f1' }}>
                      <User className="h-4 w-4" />
                    </Avatar>
                    <div>
                      <Typography className="!font-bold">{c.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.metadata.email || 'No email'}</Typography>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Typography className="!font-bold" color={c.score > 0.7 ? "success.main" : "text.primary"}>
                      {(c.score * 100).toFixed(0)}%
                    </Typography>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(c.metadata.skills || []).slice(0, 3).map((s: string) => (
                      <Chip key={s} label={s} size="small" className="!text-[10px]" />
                    ))}
                    {(c.metadata.skills || []).length > 3 && (
                      <Typography variant="caption" color="text.secondary">+{c.metadata.skills.length - 3}</Typography>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                   <Chip 
                    label={c.score > 0.7 ? "Top Match" : "Strong"} 
                    color={c.score > 0.7 ? "success" : "primary"}
                    size="small"
                    className="!font-bold"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {candidates.length === 0 && (
        <Box className="p-12 text-center">
          <Typography color="text.secondary">No candidates saved in the pool for this search yet.</Typography>
        </Box>
      )}
    </Paper>
  );
};
