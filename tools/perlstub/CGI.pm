package CGI;
# Minimal stand-in for CGI.pm: parameters come from QUERY_STRING; enough for command-line generation.
use strict; use warnings;
sub new { my $c=shift; my %p; for my $kv (split /[&;]/, ($ENV{QUERY_STRING}||'')) { my ($k,$v)=split /=/,$kv,2; next unless defined $k; $v//= ''; for ($k,$v){ tr/+/ /; s/%([0-9A-Fa-f]{2})/chr(hex($1))/ge; } $p{$k}=$v; } return bless {p=>\%p}, $c; }
sub param { my ($s,$k)=@_; return keys %{$s->{p}} unless defined $k; return $s->{p}{$k}; }
sub cookie { return undef; }
sub header { return "Content-type: text/html; charset=utf-8\n\n"; }
sub url { return 'officium.pl'; }
sub escapeHTML { my ($s,$t)=@_; $t//= ''; $t=~s/&/&amp;/g; $t=~s/</&lt;/g; $t=~s/>/&gt;/g; return $t; }
sub AUTOLOAD { return ''; }
sub DESTROY {}
1;
