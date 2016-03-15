#!/usr/bin/perl

#Usage: perl convertInsilicoCmapToGff.pl <input cmap> <output folder> <reference fasta> <reference fasta key file>

use strict;
use warnings;
use Cwd qw(realpath);
use File::Basename;
use Bio::SeqIO;
use File::Path qw(make_path);

#print "\n";

my $enzyme = "GCTCTTC";

# check cmap input variable
my $basenameCmap;
my $cmapFile;
if (defined $ARGV[0] && -e $ARGV[0]) {
	$ARGV[0] =~ /cmap/i or die "ERROR: $ARGV[0] was not recognized as a CMAP file\n";
	$cmapFile = realpath($ARGV[0]);
	#print "Converting from CMAP to GFF3: $cmapFile\n";
	$basenameCmap = basename($cmapFile);
	$basenameCmap =~ s/\.[^.]+$//;
	}
else {
	die "ERROR: Input CMAP file $ARGV[0] not provided or does not exist! $!\n";
} 

# check output folder variable
my $outputFolder;
my $outputFile;
if (defined $ARGV[1]) {
	$outputFolder = $ARGV[1];
	$outputFolder = realpath($outputFolder);
	if ($ARGV[1] ne './') {
		if (!-d $outputFolder) {
			make_path($outputFolder);			
		}
		else {
			die "ERROR: Output folder not provided or already exists! $!\n";
		}
	}
	else {
		$outputFile = "$outputFolder/$basenameCmap.gff3";
		if (-e "$outputFile") {
			die "ERROR: Output file $outputFile already exists! $!\n";
		}
	}
	#print "\tOutput folder: $outputFolder\n";
	#print "\tOutput file: $outputFile\n";	
}

#check input fasta variable
my $basenameFasta;
my $fastaFile;
if (defined $ARGV[2] && -e $ARGV[2]) {
	#$ARGV[2] =~ /fa/i or die "ERROR: $ARGV[2] was not recognized as a FASTA file\n";
	$fastaFile = realpath($ARGV[2]) or die "ERROR: Could not get absolute path of $ARGV[2]. $!\n";
	#print "\tUsing FASTA file $fastaFile\n";
	$basenameFasta = basename($fastaFile);
	$basenameFasta =~ s/\.[^.]+$//;
	}
else {
	die "ERROR: Input FASTA file $ARGV[2] not provided or does not exist! $!\n";
} 

#check input key file variable
#my $basenameFasta;
my $keyFile;
if (defined $ARGV[3] && -e $ARGV[3]) {
	$ARGV[3] =~ /key/i or die "ERROR: $ARGV[3] was not recognized as a key file\n";
	$keyFile = realpath($ARGV[3]) or die "ERROR: Could not get absolute path of $ARGV[3]. $!\n";
	#print "\tUsing FASTA key file $keyFile\n";
	#$basenameFasta = basename($fastaFile);
	#$basenameFasta =~ s/\.[^.]+$//;
	}
else {
	die "ERROR: Input FASTA key file $ARGV[3] not provided or does not exist! $!\n";
}

#load input CMAP into @AoH
#print "\t\tLoading CMAP file...\n";
my @cmap = loadCMAP($cmapFile);

#load input FASTA into BioPerl Seq object
#print "\t\tLoading FASTA file...\n";
my $seqin = Bio::SeqIO->new( -file => "$fastaFile");

#load input key file into %HoH
#print "\t\tLoading FASTA key file...\n";
my %keyHash = loadFastaKey($keyFile);

#open output file
open OUT, ">$outputFile" or die "ERROR: Unable to open output file $outputFile. $!\n";

#build up GFF3 output header 
my $header = "##gff-version 3";
print OUT "$header\n";
print "$header\n";

#print "\n";

#loop over FASTA then CMAP
while((my $seqobj = $seqin->next_seq())) {
	my $id  = $seqobj->display_id();
	my $desc = $seqobj->desc();
	#look up CMapId based on FASTA id
	my @cmapId = grep {/$id/i } keys %keyHash;
	#print "Id: $id Desc: $desc CMapId: $cmapId[0]\n";
	
	my @labelPos;
	foreach (@cmap) {
		if ($_->{CMapId} eq $cmapId[0]) {
			#print "\t".$_->{SiteID}."\n";
			my $pos = $_->{Position};
			push @labelPos, $pos;
		}
	}
	#my $line = "$id\t.\tgene\t".int($labelPos[0])."\t".int($labelPos[-1])."\t.\t.\t0\tID=$cmapId[0];Name=$id";
	my $line = "$id\t.\tgene\t".int(1)."\t".int($labelPos[-1])."\t.\t.\t0\tID=$cmapId[0];Name=$id";
	print OUT "$line\n";
	print "$line\n";
	
	my @out;
	for (my $i=0; $i<scalar(@labelPos)-1; $i++) {
		my $start = int($labelPos[$i]);
		my $end = int($labelPos[$i]) + length($enzyme);
		
		my $count = $i + 1;
		#print "$start $end $count\n";
		$line = "$id\t.\texon\t$start\t$end\t.\t.\t0\tID=Label$count;Parent=$cmapId[0]";
		#$line = "'".$line."'";
		print $line."\n";
		push @out, $line;
	}
	print OUT join("\n",@out);
}

close OUT;



sub loadCMAP {
	my $inFile = shift;
	my @cmap;
	open CMAP, "<$inFile" or die "ERROR: Unable to read in CMAP file $inFile. $!\n";
	while (my $line = <CMAP>) {
		chomp($line);
		if ($line =~ /^#/) {
			next; 
		}
		elsif ($line =~ /Nickase/) {
			# Nickase Recognition Site 1:	GCTCTTC
			my @s = split("\t",$line);
			$enzyme = $s[1];
		}
		else {
			$line =~ s/\r//g;
			my @s = split(/\t/,$line);
			#h CMapId	ContigLength	NumSites	SiteID	LabelChannel	Position	StdDev	Coverage	Occurrence
			my %cmap_line = (
				"CMapId"  => "$s[0]", 
				"ContigLength" => "$s[1]", 
				"NumSites"  => "$s[2]", 
				"SiteID"  => "$s[3]", 
				"LabelChannel"  => "$s[4]", 
				"Position"  => "$s[5]", 
				"StdDev" => "$s[6]", 
				"Coverage" => "$s[7]", 
				"Occurrence" => "$s[8]"
			);
			push @cmap, \%cmap_line;		
		}
	}
	return @cmap;
}

sub loadFastaKey {
	my $inFile = shift;
	my %keyHash=();
	open KEY, "<$inFile" or die "ERROR: Unable to read in FASTA key file $inFile. $!\n";
	while (my $line = <KEY>) {
		chomp($line);
		if ($line =~ /^#/) {
			next; 
		}
		elsif ($line =~ /^CompntId/) {
			next;
		}
		else {
			$line =~ s/\r//g;
			my @s = split(/\t/,$line);
			#CompntId	CompntName	CompntLength
			#$keyHash{$s[0]}{"Name"} = $s[1];
			#$keyHash{$s[0]}{"Length"} = $s[2];
			$keyHash{$s[0]} = $s[1];
		}
	}
	return %keyHash;
}
